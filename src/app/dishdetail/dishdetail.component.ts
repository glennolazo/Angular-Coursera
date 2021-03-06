import { Component, OnInit, ViewChild, Inject } from "@angular/core";
import { Dish } from "../shared/dish";
import { Comment } from "./../shared/comment";
import { baseURL } from "../shared/baseurl";

import { DishService } from "../services/dish.service";
import { Params, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { switchMap } from "rxjs/operators";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import {
  trigger,
  state,
  style,
  transition,
  animate
} from "@angular/animations";

@Component({
  selector: "app-dishdetail",
  templateUrl: "./dishdetail.component.html",
  styleUrls: ["./dishdetail.component.scss"],
  animations: [
    trigger('visibility', [
      state(
        'shown',
        style({
          transform: 'scale(1.0)',
          opacity: 1
        })
      ),
      state(
        'hidden',
        style({
          transform: 'scale(0.5)',
          opacity: 0
        })
      ),
      transition('* => *', animate('0.5s ease-in-out'))
    ])
  ]
})
export class DishdetailComponent implements OnInit {
  commentForm: FormGroup;
  comment: Comment;
  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  dishcopy: Dish;
  visibility = "shown";
  @ViewChild("cform")
  commentFormDirective;

  formErrors = {
    author: "",
    comment: ""
  };

  validationMessages = {
    author: {
      required: "Author Name is required.",
      minlength: "First Name must be at least 2 characters long."
    },
    comment: {
      required: "Comment is required."
    }
  };

  constructor(
    private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject("BaseURL") private BaseURL
  ) {}

  ngOnInit() {
    this.createForm();
    this.dishService
      .getDishIds()
      .subscribe(dishIds => (this.dishIds = dishIds));
    this.route.params
      .pipe(
        switchMap((params: Params) => {
          this.visibility = "hidden";
          return this.dishService.getDish(params["id"]);
        })
      )
      .subscribe(
        dish => {
          this.dish = dish;
          this.dishcopy = dish;
          this.setPrevNext(dish.id);
          this.visibility = "shown";
        },
        errmess => (this.errMess = <any>errmess)
      );
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[
      (this.dishIds.length + index - 1) % this.dishIds.length
    ];
    this.next = this.dishIds[
      (this.dishIds.length + index + 1) % this.dishIds.length
    ];
  }

  goBack(): void {
    this.location.back();
  }

  createForm() {
    this.commentForm = this.fb.group({
      author: ["", [Validators.required, Validators.minLength(2)]],
      comment: ["", [Validators.required]],
      rating: 5
    });

    this.commentForm.valueChanges.subscribe(data => this.onValueChange(data));
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    this.comment.date = new Date().toISOString();
    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy).subscribe(
      dish => {
        this.dish = dish;
        this.dishcopy = dish;
      },
      errmess => {
        this.dish = null;
        this.dishcopy = null;
        this.errMess = <any>errmess;
      }
    );
    this.commentFormDirective.resetForm();
    this.commentForm.reset({
      name: "",
      comment: "",
      rating: 5
    });
  }

  onValueChange(data?: any) {
    if (!this.commentForm) {
      return;
    }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = "";
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + " ";
            }
          }
        }
      }
    }
  }
}
